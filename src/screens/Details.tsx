import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Box, HStack, ScrollView, Text, useTheme, VStack } from 'native-base';
import { CircleWavyCheck, ClipboardText, DesktopTower, Hourglass } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Button } from '../components/Button';
import { CardDetails } from '../components/CardDetails';
import { Header } from '../components/Header';
import { Input } from '../components/Input';
import { Loading } from '../components/Loading';
import { OrderProps } from '../components/Order';
import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';
import { dateFormat } from '../utils/firestoreDateFormat';

type RouteParams = {
    orderId: string;
}

type OrderDetails = OrderProps & {
    description: string;
    solution?: string;
    closed?: string;
}

export function Details() {
    const [isLoading, setIsLoading] = useState(true);
    const [solution, setSolution] = useState('');
    const [order, setOrder] = useState<OrderDetails>({} as OrderDetails);
    
    const route = useRoute();

    const navigation = useNavigation();

    const { orderId } = route.params as RouteParams;

    const { colors } = useTheme();

    function handleOrderClose() {
        if (!solution) {
            return Alert.alert('Solicitação', 'Informe solução para encerrar a solicitação');
        }

        firestore()
        .collection<OrderFirestoreDTO>('orders')
        .doc(orderId)
        .update({
            status: 'closed',
            solution,
            closed_at: firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            Alert.alert('Solicitação', 'Solicitação encerrada.')
            navigation.goBack();
        })
        .catch(error => {
            console.log(error);
            Alert.alert('Solicitação', 'Não foi possível encerrar a solicitação');
        })
    }

    useEffect(() => {
        firestore()
        .collection<OrderFirestoreDTO>('orders')
        .doc(orderId)
        .get()
        .then(document => {
            const { create_at, description, patrimony, status, closed_at, solution } = document.data();

            const closed = closed_at ? dateFormat(closed_at) : null;

            setOrder({
                id: document.id,
                patrimony,
                description,
                status,
                solution,
                when: dateFormat(create_at),
                closed
            });

            setIsLoading(false);
        })    
    }, []);

    if (isLoading) {
        return <Loading />
    }
    
    return (
        <VStack flex={1} bg="gray.700">
            <Box px={6} bg="gray.600">
                <Header title="Solicitação" />
            </Box>
            <HStack
                bg="gray.500"
                justifyContent="center"
                p={4}
            >
                {
                    order.status === 'closed'
                    ? <CircleWavyCheck size={22} color={colors.green[300]} />
                    : <Hourglass size={22} color={colors.secondary[700]} />
                }

                <Text
                    fontSize="sm"
                    color={order.status === 'closed' ? colors.green[300] : colors.secondary[700]}
                    ml={2}
                    textTransform="uppercase"
                >
                    {
                        order.status === 'closed' ? 'finalizado' : 'em andamento'
                    }
                </Text>
            </HStack>
            <ScrollView mx={5} showsVerticalScrollIndicator={false}>
                <CardDetails
                    title="equipamento"
                    description={`Patrimônio ${order.patrimony}`}
                    icon={DesktopTower}
                />

                <CardDetails
                    title="descrição do problema"
                    description={`${order.description}`}
                    icon={ClipboardText}
                    footer={`Registrado em: ${order.when}`}
                />

                <CardDetails
                    title="solução"
                    description={order.solution }
                    icon={CircleWavyCheck}
                    footer={order.closed && `Encerrado em ${order.closed}`}
                >
                    {
                        order.status === 'open' && (
                            <Input
                                placeholder='Descrição da solução'
                                onChangeText={setSolution}
                                textAlignVertical="top"
                                multiline
                                h={24}
                            />
                        )
                    }
                </CardDetails>
            </ScrollView>
            {
                order.status === 'open' && (
                    <Button
                        title="Encerrar solicitação"
                        m={5}
                        onPress={handleOrderClose}
                    />
                )
            }
        </VStack>
    );
}
